import './App.scss';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import Header from './components/Header/CHead/Header';
import Main from './components/Main-page/CMain/Main';
import AutoList from './components/Goods/CAutolist/Autolist';
import CarDetails from './components/Goods/CCard/Card';
import Login from './components/Login/CAuth/Auth';
import Register from './components/Login/CReg/Reg';
import ConfirmCode from './components/Login/CConfirm_code/Code';
import AddCar from './components/Goods/CAdd-car/Add-car';
import ManualAddCar from './components/Goods/CAdd-car/ManualAddCar';
import EditCar from './components/Goods/CEdit-car/Edit-car';
import Profile from './components/Profile/Profile';
import ReportContainer from './components/Report/CReport-container/Container-Report';
import Footer from './components/Footer/Footer';
import Fixed from './components/Header/CMenu/Fixed';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <div className="App">
          <Fixed/>
          <div className='container'>
            <Header />
            <div className='changetable-content'>
              <Routes>
                <Route path="/" element={<Navigate to="/home-page" replace />} />
                <Route path='/home-page' element={<Main />} />
                <Route path='/buy-page' element={<AutoList />} />
                <Route path='/car/:vin' element={<CarDetails />} />
                <Route path='/exit-page' element={<Login />} />
                <Route path='/reg' element={<Register />} />
                <Route path='/confirm-code' element={<ConfirmCode />} />
                <Route path='/sale-page' element={<AddCar />} />
                <Route path='/cars/manual-add/' element={<ManualAddCar />} />
                <Route path='/cars/:vin/update/' element={<EditCar />} />
                <Route path='/my-profile' element={<Profile />} />
                
                {/* Добавлены маршруты для отчёта */}
                <Route path='/report/create' element={<ReportContainer status="creation" />} />
                <Route path='/report/progress/:reportId/:vin' element={<ReportContainer status="progress" />} />
                <Route path='/report/result/:reportId/:vin' element={<ReportContainer status="result" />} />
                <Route path='/report/:vin' element={<ReportContainer status="result" />} />
              </Routes>
            </div>
          </div>
          <Footer/>
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
