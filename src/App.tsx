import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index.tsx";
import Rooms from "./pages/Rooms.tsx";
import RoomDetail from "./pages/RoomDetail.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import UserDashboard from "./pages/UserDashboard.tsx";
import OwnerDashboard from "./pages/OwnerDashboard.tsx";
import OwnerRooms from "./pages/OwnerRooms.tsx";
import OwnerRoomForm from "./pages/OwnerRoomForm.tsx";
import OwnerItems from "./pages/OwnerItems.tsx";
import OwnerItemForm from "./pages/OwnerItemForm.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/rooms" element={<Rooms />} />
            <Route path="/rooms/:slug" element={<RoomDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/app" element={<UserDashboard />} />
              <Route path="/app/reservations" element={<UserDashboard />} />
              <Route path="/owner" element={<OwnerDashboard />} />
              <Route path="/owner/rooms" element={<OwnerRooms />} />
              <Route path="/owner/rooms/new" element={<OwnerRoomForm />} />
              <Route path="/owner/rooms/:slug/edit" element={<OwnerRoomForm />} />
              <Route path="/owner/items" element={<OwnerItems />} />
              <Route path="/owner/items/new" element={<OwnerItemForm />} />
              <Route path="/owner/items/:id/edit" element={<OwnerItemForm />} />
            </Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
