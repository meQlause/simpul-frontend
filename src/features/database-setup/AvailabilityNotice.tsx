import { databaseCopy as copy } from './database.copy';

export function AvailabilityNotice() {
  return (
    <div className="notice" role="note" data-component="Notice">
      <div>
        <strong>{copy.noticeTitle}</strong>
        <p>{copy.noticeBody}</p>
        <p>{copy.noticeOutage}</p>
      </div>
    </div>
  );
}
