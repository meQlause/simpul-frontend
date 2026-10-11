import { Link } from 'react-router';
import { Drawer } from '../../../shared/ui/Drawer';
import { ScreenState } from '../../../shared/ui/ScreenState';
import { useScreenState } from '../../../shared/useScreenState';
import { useReviewItem } from '../review-queue.api';
import { reviewCopy as copy } from '../review-queue.copy';
import { reviewAction } from './ReviewList';
import type { ReviewItem } from '../review-queue.schema';
import { MappingForm } from './MappingForm';

export function ReviewDrawer({
  id,
  mapping,
  onClose,
  onSaved,
}: {
  id: string;
  mapping: boolean;
  onClose: () => void;
  onSaved: (kind: string) => void;
}) {
  const query = useReviewItem(id);
  const state = useScreenState(query, false);
  const item = query.data?.data;

  if (item && canMap(item, mapping)) {
    return <MappingForm item={item} onClose={onClose} onSaved={onSaved} />;
  }

  return (
    <Drawer
      title={item?.title ?? copy.title}
      eyebrow="NEEDS REVIEW / CONTEXT"
      description="See what is missing before choosing the next step."
      closeLabel="Close review"
      onClose={onClose}
      footer={
        <>
          <button className="button" onClick={onClose}>
            Close review
          </button>
          {item && (
            <Link className="button button-primary" to={reviewAction(item)}>
              {copy.kinds[item.kind].action}
            </Link>
          )}
        </>
      }
    >
      {item ? (
        <>
          <h3>Useful information. One missing connection.</h3>
          <p>{copy.kinds[item.kind].reason}</p>
          <h3>The detected update</h3>
          <p>{item.channel.displayName}</p>
          <p>{item.detail}</p>
          <p>This item has not triggered a notification. Raw chat remains restricted.</p>
        </>
      ) : (
        <ScreenState
          state={state}
          onRetry={() => {
            void query.refetch();
          }}
        />
      )}
    </Drawer>
  );
}

function canMap(item: ReviewItem | undefined, mapping: boolean) {
  return mapping && item !== undefined && item.kind !== 'unrouted';
}
