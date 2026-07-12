import { Outlet } from 'react-router-dom';
import { NavBar } from './NavBar';
import { Footer } from './Footer';
import { Container } from './Container';

export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-bg-base">
      <NavBar />
      <main className="flex-1 py-6 sm:py-8">
        <Container>
          <Outlet />
        </Container>
      </main>
      <Footer />
    </div>
  );
}
