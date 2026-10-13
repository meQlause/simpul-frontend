import { Icon } from './Icon';

// Every error that is not a field's own (error-handling §5): a toast that stays until it is
// closed, because the admin has to act on it. Declare it inside the drawer or popup the error
// belongs to: outside an open modal dialog it would be inert and painted over.
export function ErrorToast({ message, onClose }: { message: string; onClose: () => void }) {
  if (!message) {
    return null;
  }

  return (
    <div className="toast visible toast-error" role="alert" data-component="ErrorToast">
      <Icon name="alert" />
      <span>{message}</span>
      <button type="button" className="toast-dismiss" aria-label="Dismiss" onClick={onClose}>
        <Icon name="close" />
      </button>
    </div>
  );
}
