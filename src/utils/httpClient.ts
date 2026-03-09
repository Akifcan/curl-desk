import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';

export interface RequestConfig {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: string;
  params?: Record<string, string>;
}

export interface ResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  time: number;
  size: number;
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

    const isHttps = urlObj.protocol === 'https:';
    const options: http.RequestOptions = {
      method: config.method.toUpperCase(),
      hostname: urlObj.hostname,
      port: urlObj.port
        ? parseInt(urlObj.port)
        : isHttps ? 443 : 80,
      path: urlObj.pathname + urlObj.search,
      headers: config.headers,
    };

    const startTime = Date.now();
    const protocol = isHttps ? https : http;

    const req = protocol.request(options, (res) => {
      const chunks: Buffer[] = [];

      res.on('data', (chunk: Buffer) => chunks.push(chunk));

      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        const body = buffer.toString('utf8');
        const time = Date.now() - startTime;
        const size = buffer.byteLength;

        const headers: Record<string, string> = {};
        Object.entries(res.headers).forEach(([k, v]) => {
          if (v !== undefined) {
            headers[k] = Array.isArray(v) ? v.join(', ') : v;
          }
        });

        resolve({
          status: res.statusCode ?? 0,
          statusText: res.statusMessage ?? '',
          headers,
          body,
          time,
          size,
        });
      });
    });

    req.on('error', (err) => reject(err));

    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timed out after 30 seconds'));
    });

    const method = config.method.toUpperCase();
    if (config.body && ['POST', 'PUT', 'PATCH'].includes(method)) {
      req.write(config.body);
    }

    req.end();
  });
}
