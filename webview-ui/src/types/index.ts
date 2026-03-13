export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
export type BodyType = 'none' | 'json' | 'text' | 'form';
export type AuthType = 'none' | 'bearer' | 'basic';
export type FormFieldType = 'text' | 'file';

export interface FormField {
  id: string;
  key: string;
  value: string;
  type: FormFieldType;
  enabled: boolean;
  fileName?: string;
  fileData?: string;   // base64 data URL, e.g. "data:image/png;base64,..."
  fileMimeType?: string;
}

export interface KeyValue {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

export interface Auth {
  type: AuthType;
  token: string;
  username: string;
  password: string;
}

export interface Request {
  id: string;
  name: string;
  method: HttpMethod;
  url: string;
  params: KeyValue[];
  headers: KeyValue[];
  body: string;
  bodyType: BodyType;
  formFields?: FormField[];
  auth: Auth;
}

export interface Collection {
  id: string;
  name: string;
  requests: Request[];
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

export interface AppTab {
  id: string;
  request: Request;
  response: ResponseData | null;
  error: string | null;
  isLoading: boolean;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function createKeyValue(): KeyValue {
  return { id: generateId(), key: '', value: '', enabled: true };
}

export function createFormField(): FormField {
  return { id: generateId(), key: '', value: '', type: 'text', enabled: true };
}

export interface EnvVariable {
  id: string;
  key: string;
  value: string;
}

export interface Environment {
  id: string;
  name: string;
  variables: EnvVariable[];
}

export function createEnvVariable(): EnvVariable {
  return { id: generateId(), key: '', value: '' };
}

export function createAppTab(request?: Request): AppTab {
  return {
    id: generateId(),
    request: request ?? createDefaultRequest(),
    response: null,
    error: null,
    isLoading: false,
  };
}

export function createDefaultRequest(): Request {
  return {
    id: generateId(),
    name: 'New Request',
    method: 'GET',
    url: '',
    params: [createKeyValue()],
    headers: [createKeyValue()],
    body: '{\n  \n}',
    bodyType: 'none',
    formFields: [createFormField()],
    auth: { type: 'none', token: '', username: '', password: '' },
  };
}

export const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: '#61afef',
  POST: '#98c379',
  PUT: '#e5c07b',
  DELETE: '#e06c75',
  PATCH: '#c678dd',
  HEAD: '#56b6c2',
  OPTIONS: '#abb2bf',
};
