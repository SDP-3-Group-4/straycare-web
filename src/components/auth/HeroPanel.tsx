import heroGraphics from '../../assets/loginGraphics.png';

export default function HeroPanel() {
  return (
    <section className="hero-panel" aria-label="StrayCare visual showcase">
      <img src={heroGraphics} alt="Hero Graphics" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </section>
  );
}
