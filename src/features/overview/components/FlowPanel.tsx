import { useState } from 'react';

const sampleDuration = 2000;

export function FlowPanel() {
  const [playing, setPlaying] = useState(false);
  const [message, setMessage] = useState('');

  function play() {
    setPlaying(true);
    setMessage('Playing the sample information flow…');
    window.setTimeout(() => {
      setPlaying(false);
      setMessage(
        'Simulation complete: order identified → rule matched → Budi selected as recipient. No messages were sent.',
      );
    }, sampleDuration);
  }

  return (
    <section
      className="routing-panel"
      data-component="FlowPanel"
      data-testid="home-flow"
      aria-label="Sample information flow"
      data-playing={playing}
    >
      <div className="routing-panel-heading">
        <div>
          <h2>
            Busy conversations.
            <br />
            Clear next steps.
          </h2>
          <p>Simpul connects updates, context, and people who need to know.</p>
        </div>
      </div>
      <div className="routing-flow">
        <div className="flow-inputs">
          <div className="flow-message">
            <b>Operations Group</b>
            <p>Mrs. Sri’s payment is confirmed.</p>
          </div>
          <div className="flow-message">
            <b>Warehouse Team</b>
            <p>Ready for the afternoon delivery.</p>
          </div>
        </div>
        <div className="flow-core">
          <img src="/assets/simpul-mark.png" alt="Simpul" />
          <span>Understands · Connects · Routes</span>
        </div>
        <div className="flow-outputs">
          <div className="flow-result">
            <b>Mrs. Sri’s order</b>
            <p>Ready to ship · ORD-0091</p>
          </div>
          <div className="flow-result">
            <b>Budi received an update</b>
            <p>Warehouse Lead · via Telegram</p>
          </div>
        </div>
      </div>
      <div className="routing-panel-footer">
        <span>AI understands. You decide. Simpul routes.</span>
        <button type="button" disabled={playing} onClick={play}>
          See how it works
        </button>
      </div>
      {message && (
        <p role="status" aria-live="polite">
          {message}
        </p>
      )}
    </section>
  );
}
