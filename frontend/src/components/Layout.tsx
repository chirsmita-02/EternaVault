import { NavLink, Outlet } from 'react-router-dom';

export default function Layout() {
	return (
		<div>
			<div className="bg-ribbons" />
            <header className="app-header">
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="brand">EternaVault</div>
                    <nav className="nav">
                        <NavLink to="/" end>Home</NavLink>
                        <NavLink to="/about">About</NavLink>
                        <NavLink to="/contact">Contact</NavLink>
                        <NavLink to="/login" className="btn outline small">Login</NavLink>
                        <NavLink to="/register" className="btn small">Register</NavLink>
                    </nav>
                </div>
            </header>
			<main className="container">
				<Outlet />
			</main>
		</div>
	);
}

