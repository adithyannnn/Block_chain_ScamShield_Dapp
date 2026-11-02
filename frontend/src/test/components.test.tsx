import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CategoryBadge } from '../components/CategoryBadge';
import { StatCard } from '../components/StatCard';
import { Activity } from 'lucide-react';

describe('CategoryBadge Component', () => {
  it('should render correct label for Phishing (Category 1)', () => {
    render(<CategoryBadge categoryId={1} />);
    expect(screen.getByText('Phishing')).toBeInTheDocument();
  });

  it('should render correct label for Malware (Category 2)', () => {
    render(<CategoryBadge categoryId={2} />);
    expect(screen.getByText('Malware / Drive-by')).toBeInTheDocument();
  });

  it('should render correct label for Scam/Drainer (Category 3)', () => {
    render(<CategoryBadge categoryId={3} />);
    expect(screen.getByText('Scam / Drainer')).toBeInTheDocument();
  });

  it('should render fallback label for unmapped category ID', () => {
    render(<CategoryBadge categoryId={99} />);
    expect(screen.getByText(/Unknown \(99\)/)).toBeInTheDocument();
  });
});

describe('StatCard Component', () => {
  it('should render title and formatted metric value', () => {
    render(
      <StatCard
        title="Unique Indicators"
        value={42}
        subtitle="On-chain records"
        icon={Activity}
        variant="cyan"
      />
    );
    expect(screen.getByText('Unique Indicators')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('On-chain records')).toBeInTheDocument();
  });
});
