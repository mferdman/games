import { Link } from 'react-router-dom';
import { Container } from '../components/layout/Container';
import { Button } from '../components/common/Button';

export function NotFoundPage() {
  return (
    <Container>
      <div className="text-center py-12">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-6">Page not found</p>
        <Link to="/">
          <Button>Go Home</Button>
        </Link>
      </div>
    </Container>
  );
}
