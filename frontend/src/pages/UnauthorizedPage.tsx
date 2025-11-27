import { Container } from '../components/layout/Container';

export function UnauthorizedPage() {
  return (
    <Container>
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Access Denied</h1>
        <p className="text-lg text-gray-600 mb-6">
          Your email is not whitelisted for access to this application.
        </p>
        <p className="text-gray-500">
          Please contact the administrator if you believe this is an error.
        </p>
      </div>
    </Container>
  );
}
