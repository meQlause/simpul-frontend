import { useState } from 'react';
import { Icon } from '../../../shared/ui/Icon';

const SAMPLE_MS = 1800;

function FlowWires() {
  return (
    <svg className="flow-wires" viewBox="0 0 820 190" preserveAspectRatio="none" aria-hidden="true">
      <path d="M150 44H244Q269 44 269 70V95H365M150 145H244Q269 145 269 120V95H365M455 95H528Q552 95 552 70V43H651M455 95H528Q552 95 552 120V144H651" />
      <path
        className="flow-wire-live"
        d="M150 44H244Q269 44 269 70V95H365M455 95H528Q552 95 552 70V43H651"
      />
      <circle cx="269" cy="95" r="4" />
      <circle cx="552" cy="95" r="4" />
    </svg>
  );
}

function Note({ position, name, text }: Record<'position' | 'name' | 'text', string>) {
  return (
    <div className={`flow-note note-${position}`}>
      <span className={position === 'top' ? 'channel-mini' : 'channel-mini pale'}>
        <Icon name="telegram" />
      </span>
      <div>
        <b>{name}</b>
        <span>{text}</span>
      </div>
    </div>
  );
}

function Result({ lead, title, line }: { lead: React.ReactNode; title: string; line: string[] }) {
  return (
    <div className="flow-result">
      {lead}
      <div>
        <b>{title}</b>
        <span>
          {line[0]} <i>·</i> {line[1]}
        </span>
      </div>
      <Icon name="check-circle" className="result-check" />
    </div>
  );
}

function FlowMap() {
  return (
    <div className="flow-map">
      <FlowWires />
      <div className="flow-inputs">
        <Note position="top" name="Operations Group" text="“Mrs. Sri’s payment is confirmed.”" />
        <Note position="bottom" name="Warehouse Team" text="“Ready for the afternoon delivery.”" />
      </div>
      <div className="flow-center">
        <div className="orbit orbit-one" />
        <div className="orbit orbit-two" />
        <div className="flow-core">
          <img className="flow-logo" src="/assets/simpul-mark.png" alt="Simpul" />
        </div>
        <span className="flow-core-label">Connected by simpul</span>
      </div>
      <div className="flow-outputs">
        <Result
          lead={
            <span className="flow-result-icon">
              <Icon name="package" />
            </span>
          }
          title="Mrs. Sri’s order"
          line={['Ready to ship', 'ORD-0091']}
        />
        <Result
          lead={<span className="avatar small mint">BS</span>}
          title="Budi received the update"
          line={['Warehouse Lead', 'via Telegram']}
        />
      </div>
    </div>
  );
}

function Heading() {
  return (
    <div className="routing-panel-heading">
      <div>
        <span className="eyebrow">YOUR INFORMATION FLOW</span>
        <h2 id="flow-title">
          Busy conversations.
          <br />
          <span>Clear next steps.</span>
        </h2>
        <p>
          Simpul connects updates, context,
          <br />
          and the people who need to know.
        </p>
      </div>
      <span className="system-live">
        <span />
        All systems running
      </span>
    </div>
  );
}

export function FlowPanel() {
  const [playing, setPlaying] = useState(false);
  const [message, setMessage] = useState('');

  function play() {
    if (playing) {
      return;
    }

    setPlaying(true);
    setMessage('Playing the sample information flow…');
    window.setTimeout(() => {
      setPlaying(false);
      setMessage(
        'Simulation complete: order identified → rule matched → Budi selected as recipient. No messages were sent.',
      );
    }, SAMPLE_MS);
  }

  return (
    <section
      className={playing ? 'routing-panel is-simulating' : 'routing-panel'}
      id="routing-flow"
      data-component="FlowPanel"
      data-testid="home-flow"
      aria-labelledby="flow-title"
    >
      <Heading />
      <FlowMap />
      <div className="routing-panel-footer">
        <span>
          <Icon name="shield" />
          AI understands. You decide. Simpul routes.
        </span>
        <button type="button" data-action="simulate" disabled={playing} onClick={play}>
          <Icon name="play" />
          See how it works <Icon name="arrow-up-right" />
        </button>
      </div>
      {message && (
        <p role="status" aria-live="polite" className="toast visible">
          {message}
        </p>
      )}
    </section>
  );
}
