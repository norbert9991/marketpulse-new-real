import Register from './Auth/Register';
import Login from './Auth/Login';
import ForexNews from './User/ForexNews';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<Register />} />
      <Route path="/login" element={<Login />} />
      <Route path="/user-dashboard" element={<UserDashboard />} />
      <Route path="/market-analysis" element={<MarketAnalysis />} />
      <Route path="/forex-news" element={<ForexNews />} />
    </Routes>
  );
}

export default App; 