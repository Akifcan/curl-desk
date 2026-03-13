import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';

export interface FormField {
  key: string;
  value: string;
  type: 'text' | 'file';
  fileName?: string;
  fileData?: string;   // base64 data URL: "data:mime/type;base64,..."
  fileMimeType?: string;
}

export interface RequestConfig {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  params?: Record<string, string>;
  formFields?: FormField[];
}

export interface ResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  time: number;
  size: number;
  contentType: string;
}

function buildMultipart(fields: FormField[]): { buffer: Buffer; boundary: string } {
  const boundary = `----FormBoundary${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  const parts: Buffer[] = [];

  for (const field of fields) {
    if (!field.key.trim()) continue;

    const head = `--${boundary}\r\n`;

    if (field.type === 'file' && field.fileData) {
      const match = field.fileData.match(/^data:([^;]+);base64,(.+)$/s);
      if (!match) continue;
      const mimeType = match[1];
      const fileBuffer = Buffer.from(match[2], 'base64');
      const fileName = field.fileName ?? 'file';
      parts.push(Buffer.from(
        `${head}Content-Disposition: form-data; name="${field.key}"; filename="${fileName}"\r\nContent-Type: ${mimeType}\r\n\r\n`
      ));
      parts.push(fileBuffer);
      parts.push(Buffer.from('\r\n'));
    } else {
      parts.push(Buffer.from(
        `${head}Content-Disposition: form-data; name="${field.key}"\r\n\r\n${field.value}\r\n`
      ));
    }
  }

  parts.push(Buffer.from(`--${boundary}--\r\n`));
  return { buffer: Buffer.concat(parts), boundary };
}

export function executeRequest(config: RequestConfig): Promise<ResponseData> {
  return new Promise((resolve, reject) => {
    let urlObj: URL;
    try {
      urlObj = new URL(config.url);
    } catch {
      reject(new Error(`Invalid URL: ${config.url}`));
      return;
    }

    if (config.params) {
      Object.entries(config.params).forEach(([key, value]) => {
        if (key.trim()) urlObj.searchParams.append(key, value);
      });
    }

    const headers = { ...config.headers };
    let bodyBuffer: Buffer | undefined;

    if (config.formFields && config.formFields.length > 0) {
      const { buffer, boundary } = buildMultipart(config.formFields);
      bodyBuffer = buffer;
      headers['Content-Type'] = `multipart/form-data; boundary=${boundary}`;
      headers['Content-Length'] = String(buffer.byteLength);
    } else if (config.body) {
      bodyBuffer = Buffer.from(config.body, 'utf8');
      headers['Content-Length'] = String(bodyBuffer.byteLength);
    }

    const isHttps = urlObj.protocol === 'https:';
    const options: http.RequestOptions = {
      method: config.method.toUpperCase(),
      hostname: urlObj.hostname,
      port: urlObj.port ? parseInt(urlObj.port) : isHttps ? 443 : 80,
      path: urlObj.pathname + urlObj.search,
      headers,
    };

    const startTime = Date.now();
    const protocol = isHttps ? https : http;

    const req = protocol.request(options, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const time = Date.now() - startTime;
        const size = buffer.byteLength;

        const responseHeaders: Record<string, string> = {};
        Object.entries(res.headers).forEach(([k, v]) => {
          if (v !== undefined) {
            responseHeaders[k] = Array.isArray(v) ? v.join(', ') : v;
          }
        });

        const contentType = responseHeaders['content-type'] ?? '';
        const isBinary = /^(image|video|audio|application\/octet-stream|application\/pdf)/.test(contentType);
        let body: string;
        if (isBinary) {
          const mime = contentType.split(';')[0].trim();
          body = `data:${mime};base64,${buffer.toString('base64')}`;
        } else {
          body = buffer.toString('utf8');
        }

        resolve({
          status: res.statusCode ?? 0,
          statusText: res.statusMessage ?? '',
          headers: responseHeaders,
          body,
          time,
          size,
          contentType,
        });
      });
    });

    req.on('error', (err) => reject(err));
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timed out after 30 seconds'));
    });

    const method = config.method.toUpperCase();
    if (bodyBuffer && ['POST', 'PUT', 'PATCH'].includes(method)) {
      req.write(bodyBuffer);
    }

    req.end();
  });
}
