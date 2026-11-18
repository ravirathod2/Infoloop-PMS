import { useRef, useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { Avatar, Button } from './ui';
import { fileToAvatar } from '../lib/image';

/** Pick a photo from the user's own files. It is cropped to a small square and saved on the record. */
export default function AvatarPicker({ value, onChange, name }) {
  const input = useRef(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow choosing the same file again
    if (!file) return;
    setError('');
    setBusy(true);
    try {
      onChange(await fileToAvatar(file));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="avatar-picker">
      <Avatar name={name || '?'} src={value} size={64} />
      <div className="ap-body">
        <div className="ap-label">Photo</div>
        <div className="ap-actions">
          <Button size="sm" icon={ImagePlus} loading={busy} onClick={() => input.current?.click()}>{value ? 'Change photo' : 'Upload photo'}</Button>
          {value && <Button size="sm" variant="tertiary" icon={Trash2} onClick={() => onChange('')}>Remove</Button>}
        </div>
        <input ref={input} type="file" accept="image/*" hidden onChange={onFile} />
        {error ? <p className="field-error" role="alert" style={{ marginTop: 6 }}>{error}</p> : <p className="field-hint" style={{ marginTop: 6 }}>JPG, PNG or WebP. It is cropped to a square.</p>}
      </div>
    </div>
  );
}
