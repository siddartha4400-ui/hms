'use client';

import { usePathname } from 'next/navigation';
import { Navbar, Nav, Container } from 'react-bootstrap';

export default function Header() {
  const pathname = usePathname();

  if (pathname.startsWith('/login')) return null;

  return (
    <Navbar expand="lg" bg="light" className="fixed-top shadow-sm">
      <Container fluid>
        <Navbar.Brand href="#">HMS</Navbar.Brand>
        <Navbar.Toggle aria-controls="navbarNav" />
        <Navbar.Collapse id="navbarNav">
          <Nav className="me-auto">
            <Nav.Link href="#" active>Home</Nav.Link>
            <Nav.Link href="#">Dashboard</Nav.Link>
            <Nav.Link href="#">Patients</Nav.Link>
            <Nav.Link href="#">Appointments</Nav.Link>
            <Nav.Link href="#">Features</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}