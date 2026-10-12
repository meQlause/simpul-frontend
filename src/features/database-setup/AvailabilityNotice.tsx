import { Icon } from '../../shared/ui/Icon';
import { databaseCopy as copy } from './database.copy';

export function AvailabilityNotice() {
  return (
    <div className="notice" role="note" data-component="Notice">
      <Icon name="shield" />
      <span>
        <strong>{copy.noticeTitle}</strong>
        <br />
        {copy.noticeBody}
        <br />
        {copy.noticeOutage}
      </span>
    </div>
  );
}
