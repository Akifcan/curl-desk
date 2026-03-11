import { BodyType } from '../../types';

interface BodyTabProps {
  bodyType: BodyType;
  body: string;
  onBodyTypeChange: (type: BodyType) => void;
  onBodyChange: (body: string) => void;
  name?: string;
}

export function BodyTab({ bodyType, body, onBodyTypeChange, onBodyChange, name = 'bodyType' }: BodyTabProps) {
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

      {bodyType !== 'none' && (
        <textarea
          className="body-editor"
          value={body}
          onChange={(e) => onBodyChange(e.target.value)}
          placeholder={
            bodyType === 'json'
              ? '{\n  "key": "value"\n}'
              : bodyType === 'form'
              ? 'key=value&key2=value2'
              : 'Request body...'
          }
          spellCheck={false}
        />
      )}

      {bodyType === 'none' && (
        <div className="body-none-msg">No body for this request.</div>
      )}
    </div>
  );
}
