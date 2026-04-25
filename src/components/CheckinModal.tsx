import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  User, 
  Calendar, 
  Users, 
  Baby, 
  Mail, 
  Phone, 
  Bed, 
  Globe, 
  CreditCard, 
  IdCard, 
  StickyNote,
  LogIn,
  CheckCircle2
} from 'lucide-react';

interface CheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation?: any;
  rooms: any[];
  clients: any[];
  onConfirm: (data: any) => void;
}

export const CheckinModal: React.FC<CheckinModalProps> = ({
  isOpen,
  onClose,
  reservation,
  rooms,
  clients,
  onConfirm
}) => {
  const [formData, setFormData] = useState({
    guestName: '',
    arrivalDate: new Date().toISOString().split('T')[0],
    departureDate: '',
    adults: 1,
    children: 0,
    email: '',
    phone: '',
    roomId: '',
    channel: 'Direct',
    paymentStatus: 'pending',
    notes: ''
  });

  useEffect(() => {
    if (reservation) {
      const client = clients.find(c => c.id === reservation.clientId);
      setFormData({
        guestName: client?.name || reservation.guestName || '',
        arrivalDate: reservation.checkin || new Date().toISOString().split('T')[0],
        departureDate: reservation.checkout || '',
        adults: reservation.pax || 1,
        children: reservation.children || 0,
        email: client?.email || reservation.guestEmail || '',
        phone: client?.phone || reservation.guestPhone || '',
        roomId: reservation.room || '',
        channel: reservation.canal || 'Direct',
        paymentStatus: reservation.paymentStatus || 'pending',
        notes: reservation.remarks || reservation.notes || ''
      });
    } else {
      setFormData({
        guestName: '',
        arrivalDate: new Date().toISOString().split('T')[0],
        departureDate: '',
        adults: 1,
        children: 0,
        email: '',
        phone: '',
        roomId: '',
        channel: 'Direct',
        paymentStatus: 'pending',
        notes: ''
      });
    }
  }, [reservation, clients, isOpen]);

  if (!isOpen) return null;

  const handleValidate = () => {
    if (!formData.guestName || !formData.arrivalDate || !formData.departureDate || !formData.roomId) {
      alert('Veuillez remplir les informations obligatoires (Nom, Dates, Chambre)');
      return;
    }
    onConfirm(formData);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-[550px] bg-white rounded-[28px] shadow-2xl overflow-hidden flex flex-col my-auto"
        >
          {/* Header */}
          <div className="bg-[#8B5CF6] text-white p-5 pr-6 relative">
            <div className="flex items-center gap-3">
              <LogIn className="w-6 h-6" />
              <div>
                <h3 className="text-lg font-bold tracking-tight">Nouveau Check-in</h3>
                <p className="text-[10px] font-medium opacity-80 uppercase tracking-widest mt-0.5">ENREGISTREMENT CLIENT IMMÉDIAT</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="absolute right-5 top-5 p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar no-scrollbar">
            {/* Client */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <User className="w-3 h-3" /> CLIENT
              </label>
              <input 
                type="text" 
                placeholder="Nom complet"
                className="w-full px-4 py-2.5 rounded-full border border-slate-200 bg-slate-50 shadow-sm focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] outline-none text-sm font-medium transition-all"
                value={formData.guestName}
                onChange={(e) => setFormData({...formData, guestName: e.target.value})}
              />
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <Calendar className="w-3 h-3" /> DATE ARRIVÉE
                </label>
                <input 
                  type="date"
                  className="w-full px-4 py-2.5 rounded-full border border-slate-200 bg-slate-50 shadow-sm focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] outline-none text-sm font-medium transition-all"
                  value={formData.arrivalDate}
                  onChange={(e) => setFormData({...formData, arrivalDate: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <Calendar className="w-3 h-3" /> DATE DÉPART
                </label>
                <input 
                  type="date"
                  className="w-full px-4 py-2.5 rounded-full border border-slate-200 bg-slate-50 shadow-sm focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] outline-none text-sm font-medium transition-all"
                  value={formData.departureDate}
                  onChange={(e) => setFormData({...formData, departureDate: e.target.value})}
                />
              </div>
            </div>

            {/* Pax */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <Users className="w-3 h-3" /> ADULTES
                </label>
                <input 
                  type="number"
                  min="1"
                  className="w-full px-4 py-2.5 rounded-full border border-slate-200 bg-slate-50 shadow-sm focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] outline-none text-sm font-medium transition-all"
                  value={formData.adults}
                  onChange={(e) => setFormData({...formData, adults: parseInt(e.target.value)})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <Baby className="w-3 h-3" /> ENFANTS
                </label>
                <input 
                  type="number"
                  min="0"
                  className="w-full px-4 py-2.5 rounded-full border border-slate-200 bg-slate-50 shadow-sm focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] outline-none text-sm font-medium transition-all"
                  value={formData.children}
                  onChange={(e) => setFormData({...formData, children: parseInt(e.target.value)})}
                />
              </div>
            </div>

            {/* Email & Tel */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <Mail className="w-3 h-3" /> EMAIL
                </label>
                <input 
                  type="email"
                  placeholder="client@email.com"
                  className="w-full px-4 py-2.5 rounded-full border border-slate-200 bg-slate-50 shadow-sm focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] outline-none text-sm font-medium transition-all"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <Phone className="w-3 h-3" /> TÉLÉPHONE
                </label>
                <input 
                  type="tel"
                  placeholder="+33 6 12 34 56 78"
                  className="w-full px-4 py-2.5 rounded-full border border-slate-200 bg-slate-50 shadow-sm focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] outline-none text-sm font-medium transition-all"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>

            {/* Room */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <Bed className="w-3 h-3" /> CHAMBRE DISPONIBLE
              </label>
              <select 
                className="w-full px-4 py-2.5 rounded-full border border-slate-200 bg-slate-50 shadow-sm focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] outline-none text-sm font-bold transition-all appearance-none cursor-pointer"
                value={formData.roomId}
                onChange={(e) => setFormData({...formData, roomId: e.target.value})}
              >
                <option value="">Sélectionner une chambre...</option>
                {rooms.map(room => (
                  <option key={room.id || room.num} value={room.id || room.num}>
                    Chambre {room.number || room.num} ({room.type})
                  </option>
                ))}
              </select>
            </div>

            {/* Channel & Payment Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <Globe className="w-3 h-3" /> CANAL
                </label>
                <select 
                  className="w-full px-4 py-2.5 rounded-full border border-slate-200 bg-slate-50 shadow-sm focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] outline-none text-sm font-bold transition-all appearance-none cursor-pointer"
                  value={formData.channel}
                  onChange={(e) => setFormData({...formData, channel: e.target.value})}
                >
                  <option value="Direct">Direct</option>
                  <option value="Booking.com">Booking.com</option>
                  <option value="Expedia">Expedia</option>
                  <option value="Airbnb">Airbnb</option>
                  <option value="Telephone">Téléphone</option>
                  <option value="Agence">Agence</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <CreditCard className="w-3 h-3" /> STATUT PAIEMENT
                </label>
                <select 
                  className="w-full px-4 py-2.5 rounded-full border border-slate-200 bg-slate-50 shadow-sm focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] outline-none text-sm font-bold transition-all appearance-none cursor-pointer"
                  value={formData.paymentStatus}
                  onChange={(e) => setFormData({...formData, paymentStatus: e.target.value})}
                >
                  <option value="vcc">💳 VCC Partenaire</option>
                  <option value="preauthorized">🔒 Préautorisé / RSP</option>
                  <option value="paid">✅ Payé</option>
                  <option value="refused">❌ Paiement refusé</option>
                  <option value="pending">⏳ En attente</option>
                </select>
              </div>
            </div>

            {/* Scan ID */}
            <div className="p-4 border-2 border-dashed border-slate-200 rounded-[20px] bg-slate-50 flex flex-col items-center justify-center text-center gap-2 hover:bg-slate-100 hover:border-[#8B5CF6] transition-all cursor-pointer group">
              <IdCard className="w-8 h-8 text-[#8B5CF6] group-hover:scale-110 transition-transform" />
              <div>
                <div className="text-xs font-bold text-slate-800 tracking-tight">Scanner ID / Passeport</div>
                <div className="text-[10px] font-medium text-slate-400 uppercase">Prêt à scanner</div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <StickyNote className="w-3 h-3" /> NOTE DE PRÉFÉRENCE
              </label>
              <textarea 
                rows={2}
                placeholder="Allergies, préférence chambre, heure d'arrivée tardive..."
                className="w-full px-5 py-3 rounded-[20px] border border-slate-200 bg-slate-50 shadow-sm focus:ring-2 focus:ring-[#8B5CF6]/20 focus:border-[#8B5CF6] outline-none text-sm font-medium transition-all resize-none"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
            <button 
              onClick={onClose}
              className="px-6 py-2.5 rounded-full bg-white border border-slate-200 text-slate-500 text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-all"
            >
              Annuler
            </button>
            <button 
              onClick={handleValidate}
              className="px-8 py-2.5 rounded-full bg-[#8B5CF6] text-white text-xs font-bold uppercase tracking-widest shadow-lg shadow-[#8B5CF6]/20 hover:bg-[#7C3AED] transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" /> Valider Check-in
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
