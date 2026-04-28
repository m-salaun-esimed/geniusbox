import { createPortal } from 'react-dom';
import nathanPhoto from '../../assets/credits/nathan.png';
import axelPhoto from '../../assets/credits/axel_prison.png';
import jeremyPhoto from '../../assets/credits/jeremy_jeu.png';
import matheoPhoto from '../../assets/credits/matheo_2.png';
import lucasPhoto from '../../assets/credits/lucas_2.png';
import matthieuPhoto from '../../assets/credits/matthieu_cowboy.png';

type CreditPerson = {
  name: string;
  photo?: string;
  quote: string;
};

const CREDITS_PEOPLE: CreditPerson[] = [
  { name: 'Nathan Sabaty', photo: nathanPhoto, quote: 'je fais 2 3 bar mitzvah.' },
  { name: 'Axel Lapierre', photo: axelPhoto, quote: 'top goy.' },
  { name: 'Jeremy Mercklen', photo: jeremyPhoto, quote: 'Si je te fend le crane en deux quel oeil se fermera le premier.' },
  { name: 'Matheo Bert', photo: matheoPhoto, quote: 'DEMACIAAAAA.' },
  { name: 'Lucas Joly', photo: lucasPhoto, quote: 'psartek le degrade.' },
  { name: 'Matthieu Salaun', photo: matthieuPhoto, quote: 'A toi mon bébé à toi ma futur femme.' },
];

const PersonCard = ({ name, photo, quote }: CreditPerson) => (
  <div className='credit-person-card'>
    <div className='credit-person-photo'>
      {photo ? (
        <img src={photo} alt={name} />
      ) : (
        <span className='credit-person-photo-placeholder'>?</span>
      )}
    </div>
    <div className='credit-person-info'>
      <p className='credit-person-name'>{name}</p>
      <p className='credit-person-quote'>"{quote}"</p>
    </div>
  </div>
);

type CreditsModalProps = {
  open: boolean;
  onClose: () => void;
};

export const CreditsModal = ({ open, onClose }: CreditsModalProps) => {
  if (!open) return null;

  return createPortal(
    <div className='modal-backdrop' onClick={onClose}>
      <div className='modal-card credits-modal' onClick={(e) => e.stopPropagation()}>
        <button type='button' className='credits-close' onClick={onClose} aria-label='Fermer'>
          ✕
        </button>

        <div className='credits-scroll'>
          <div className='credits-header'>
            <div className='credits-logo'>
              <span className='credits-logo-icon'>GB</span>
            </div>
            <h2 className='credits-title'>GeniusBox</h2>
            <p className='credits-subtitle'>Quiz & Parcours — Jeu de bureau local</p>
            <p className='credits-initiative'>Initiative ludo-pédagogique proposée par<br /><strong>Thierry Secqueville</strong> · Esimed 2026</p>
          </div>

          <div className='credits-body'>
            <section className='credits-section'>
              <h3 className='credits-section-title'>L'équipe</h3>
              <div className='credits-people-grid'>
                {CREDITS_PEOPLE.map((person, index) => (
                  <PersonCard key={index} {...person} />
                ))}
              </div>
            </section>

            <section className='credits-section'>
              <h3 className='credits-section-title'>Technologies</h3>
              <div className='credits-tech-grid'>
                <span className='credits-tech-pill'>Electron</span>
                <span className='credits-tech-pill'>React</span>
                <span className='credits-tech-pill'>TypeScript</span>
                <span className='credits-tech-pill'>Zustand</span>
                <span className='credits-tech-pill'>Vite</span>
                <span className='credits-tech-pill'>Vitest</span>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};
