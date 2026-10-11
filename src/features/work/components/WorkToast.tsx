import { useWorkChange } from '../work.api';
import { useOnline } from '../../../shared/useOnline';

type Notice = { text: string; undoId: string };

export function WorkToast({
  notice,
  onNotice,
}: {
  notice: Notice;
  onNotice: (notice: Notice) => void;
}) {
  const undo = useWorkChange(notice.undoId);
  const online = useOnline();

  if (!notice.text) {
    return null;
  }

  return (
    <div className="toast visible" role="status">
      {notice.text}
      {notice.undoId && (
        <button
          disabled={undo.isPending || !online}
          onClick={() =>
            undo.mutate(undefined, {
              onSuccess: () => onNotice({ text: 'Change undone.', undoId: '' }),
              onError: (error) => onNotice({ text: error.message, undoId: '' }),
            })
          }
        >
          Undo
        </button>
      )}
    </div>
  );
}
