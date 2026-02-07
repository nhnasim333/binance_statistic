import { Outlet } from 'react-router-dom';
import Dashboard from './Dashboard';

const MainLayout = () => {
    return (
        <div className="min-h-screen bg-[#0B0E11]">
            <Dashboard />
            <Outlet />
        </div>
    );
};

export default MainLayout;