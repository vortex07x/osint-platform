function ConfirmModal({ title, message, confirmLabel = 'CONFIRM', onConfirm, onCancel, danger = true }) {
  return (
    <div className="expand-modal-overlay" onClick={onCancel}>
      <div className="confirm-modal-box" onClick={(e) => e.stopPropagation()}>
        <div className={`confirm-modal-bar ${danger ? 'danger' : ''}`} />
        <div className="confirm-modal-body">
          <h3 className="confirm-modal-title">{title}</h3>
          <p className="confirm-modal-message">{message}</p>
          <div className="confirm-modal-actions">
            <button className="confirm-modal-cancel" onClick={onCancel}>CANCEL</button>
            <button
              className={`confirm-modal-confirm ${danger ? 'danger' : ''}`}
              onClick={onConfirm}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal