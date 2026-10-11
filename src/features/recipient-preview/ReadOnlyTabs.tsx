import { previewCopy as copy } from './recipient-preview.copy';
import type { Preview } from './recipient-preview.schema';

export function DigestTab({ digest }: { digest: Preview['digest'] }) {
  return (
    <div className="message-preview email-preview">
      <div className="message-sender">{copy.digest.title(digest.recipientName ?? '')}</div>
      <p>
        <strong>{copy.digest.summary(digest.items.length)}</strong>
      </p>
      <ul>
        {digest.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <small>{copy.digest.scheduled(digest.time)}</small>
    </div>
  );
}

export function VoiceTab({ voice }: { voice: Preview['voiceNote'] }) {
  return (
    <>
      <div className="message-preview telegram-preview">
        <div className="message-sender">{copy.voice.title}</div>
        <p>
          <strong>{copy.voice.transcript}</strong>
          <br />
          {voice.transcriptSample}
        </p>
        <small>{copy.voice.normalized}</small>
      </div>
      <div className="setup-failure">
        <strong>{copy.voice.unavailable}</strong>
        <p>
          {voice.failureMessage} {copy.voice.noStatus}
        </p>
      </div>
    </>
  );
}
