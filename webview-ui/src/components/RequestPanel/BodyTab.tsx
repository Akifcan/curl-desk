import { BodyType, FormField, createFormField } from '../../types';
import { FormDataTable } from './FormDataTable';

interface BodyTabProps {
  bodyType: BodyType;
  body: string;
  formFields: FormField[] | undefined;
  onBodyTypeChange: (type: BodyType) => void;
  onBodyChange: (body: string) => void;
  onFormFieldsChange: (fields: FormField[]) => void;
  name?: string;
}

export function BodyTab({
  bodyType,
  body,
  formFields,
  onBodyTypeChange,
  onBodyChange,
  onFormFieldsChange,
  name = 'bodyType',
}: BodyTabProps) {
  const safeFormFields = formFields?.length ? formFields : [createFormField()];

  return (
    <div className="body-tab">
      <div className="body-type-row">
        {(['none', 'json', 'text', 'form'] as BodyType[]).map((type) => (
          <label key={type} className="radio-label">
            <input
              type="radio"
              name={name}
              value={type}
              checked={bodyType === type}
              onChange={() => onBodyTypeChange(type)}
            />
            {type === 'none' ? 'None' : type === 'json' ? 'JSON' : type === 'text' ? 'Text' : 'Form'}
          </label>
        ))}
      </div>

      {bodyType === 'none' && (
        <div className="body-none-msg">No body for this request.</div>
      )}

      {(bodyType === 'json' || bodyType === 'text') && (
        <textarea
          className="body-editor"
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          placeholder={bodyType === 'json' ? '{\n  "key": "value"\n}' : 'Request body...'}
          spellCheck={false}
        />
      )}

      {bodyType === 'form' && (
        <FormDataTable fields={safeFormFields} onChange={onFormFieldsChange} />
      )}
    </div>
  );
}
