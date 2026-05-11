import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index.tsx";
import Rooms from "./pages/Rooms.tsx";
import RoomDetail from "./pages/RoomDetail.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import MyReservations from "./pages/MyReservations.tsx";
import ReservationDetail from "./pages/ReservationDetail.tsx";
import RequestReservation from "./pages/RequestReservation.tsx";
import OwnerDashboard from "./pages/OwnerDashboard.tsx";
import OwnerRooms from "./pages/OwnerRooms.tsx";
import OwnerRoomForm from "./pages/OwnerRoomForm.tsx";
import OwnerItems from "./pages/OwnerItems.tsx";
import OwnerPending from "./pages/OwnerPending.tsx";
import OwnerItemForm from "./pages/OwnerItemForm.tsx";
import NotFound from "./pages/NotFound.tsx";
import Equipment from "./pages/Equipment.tsx";
import EquipmentDetail from "./pages/EquipmentDetail.tsx";
import RequestRental from "./pages/RequestRental.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/rooms" element={<Rooms />} />
              <Route path="/rooms/:slug" element={<RoomDetail />} />
              <Route path="/equipment" element={<Equipment />} />
              <Route path="/equipment/:id" element={<EquipmentDetail />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/app" element={<Navigate to="/app/reservations" replace />} />
              <Route path="/equipment/request" element={<RequestRental />} />
              <Route path="/rooms/:slug/reserve" element={<RequestReservation />} />
              <Route path="/app/reservations" element={<MyReservations />} />
              <Route path="/app/reservations/:id" element={<ReservationDetail />} />
              <Route path="/owner" element={<OwnerDashboard />} />
              <Route path="/owner/pending" element={<OwnerPending />} />
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
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
