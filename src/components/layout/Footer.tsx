/**
 * Footer nav — maps Figma's footer link row.
 * Semantic <nav> with real <a> elements.
 */
import footerIcon from '../../assets/footericon.svg';

const FOOTER_LINKS = [
  { label: 'Careers', href: '#' },
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms & Conditions', href: '#' },
  { label: 'Partners', href: '#' },
  { label: 'Help Center', href: '#' },
  { label: 'Contact', href: '#' },
];

export default function Footer() {
  return (
    <footer className="auth-footer" role="contentinfo">
      <nav className="auth-footer__nav" aria-label="Footer navigation">
        {FOOTER_LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="auth-footer__link"
          >
            {link.label}
          </a>
        ))}
      </nav>
      <div className="auth-footer__mark" aria-label="StrayCare">
        <img src={footerIcon} alt="StrayCare" style={{ width: '28px', height: '28px' }} />
      </div>
    </footer>
  );
}
