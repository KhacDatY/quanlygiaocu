import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Auth/Login';
import MainLayout from './components/layout/MainLayout';


//TEACHER
import CreateProposal from './pages/Teacher/CreateProposal';
import MyProposals from './pages/Teacher/MyProposals';
import ProposalDetail from './pages/Teacher/ProposalDetail';
import EditProposal from './pages/Teacher/EditProposal';
import NeedEditProposalDetail from './pages/Teacher/NeedEditProposalDetail';

//MANAGER
import PendingProposals from './pages/Manager/PendingProposals';
import ManagerProposalDetail from './pages/Manager/ManagerProposalDetail';

//ACOUNTANT
import PendingBudgetProposals from './pages/Accountant/PendingBudgetProposals';
import AccountantProposalDetail from './pages/Accountant/AccountantProposalDetail';

//DIRECTOR
import PendingDirectorProposals from './pages/Director/PendingDirectorProposals';
import DirectorProposalDetail from './pages/Director/DirectorProposalDetail';


import PendingPurchaseProposals from './pages/Administrative/PendingPurchaseProposals';
import AdminProposalDetail from './pages/Administrative/AdminProposalDetail';
import PurchaseConfirmationForm from './pages/Administrative/PurchaseConfirmationForm';
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />} />

          {/* LUỒNG CỦA ADMIN (Thêm mới để sửa lỗi) */}
          <Route path="/admin" element={
            <div className="p-8">
              <h1 className="text-2xl font-bold text-primary">Trang Quản Trị Viên (Admin)</h1>
              <p>Giao diện admin sẽ được cập nhật sau.</p>
            </div>
          } />
          
          {/* LUỒNG CỦA TEACHER */}
          <Route path="/teacher" element={<MainLayout role="TEACHER" />}>
            <Route index element={<Navigate to="my-proposals" replace />} />
            <Route path="create-proposal" element={<CreateProposal />} />
            <Route path="my-proposals" element={<MyProposals />} />
            <Route path="proposal-detail/:id" element={<ProposalDetail />} />
            <Route path="edit-proposal/:id" element={<EditProposal />} />
            <Route path="need-edit-proposal-detail/:id" element={<NeedEditProposalDetail />} />
          </Route>

          {/* LUỒNG CỦA MANAGER */}           
          <Route path="/manager" element={<MainLayout role="MANAGER" />}>             
            <Route index element={<Navigate to="pending" replace />} />             
            <Route path="pending" element={<PendingProposals />} />             
            <Route path="proposal-detail/:id" element={<ManagerProposalDetail />} />
          </Route>

          {/* LUỒNG CỦA ACCOUNTANT (KẾ TOÁN) */}
          <Route path="/accountant" element={<MainLayout role="ACCOUNTANT" />}>
            <Route index element={<Navigate to="pending-budget" replace />} />
            <Route path="pending-budget" element={<PendingBudgetProposals />} />
            <Route path="proposal-detail/:id" element={<AccountantProposalDetail />} />
          </Route>

          {/* LUỒNG CỦA GIÁM ĐỐC (DIRECTOR) */}
          <Route path="/director" element={<MainLayout role="DIRECTOR" />}>
            <Route index element={<Navigate to="pending-approvals" replace />} />
            <Route path="pending-approvals" element={<PendingDirectorProposals />} />
            <Route path="proposal-detail/:id" element={<DirectorProposalDetail />} />
          </Route>
          
          {/* LUỒNG CỦA Phòng hành chính (ADMINISTRATIVE) */}
          <Route path="/administrative" element={<MainLayout role="ADMINISTRATIVE_STAFF" />}>
            <Route index element={<Navigate to="pending-purchases" replace />} />
            <Route path="pending-purchases" element={<PendingPurchaseProposals />} />
            <Route path="proposal-detail/:id" element={<AdminProposalDetail />} />
            <Route path="purchase-form/:id" element={<PurchaseConfirmationForm />} />
          </Route>
          
        </Routes>

        
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;