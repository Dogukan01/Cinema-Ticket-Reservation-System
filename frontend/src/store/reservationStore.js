import { create } from 'zustand';

const useReservationStore = create((set) => ({
    selectedSeats: [],
    showtimeDetails: null, 
    totalAmount: 0,
    
    setReservationData: (data) => set((state) => ({ 
        selectedSeats: data.selectedSeats !== undefined ? data.selectedSeats : state.selectedSeats,
        showtimeDetails: data.showtimeDetails !== undefined ? data.showtimeDetails : state.showtimeDetails,
        totalAmount: data.totalAmount !== undefined ? data.totalAmount : state.totalAmount
    })),
    
    clearReservation: () => set({ selectedSeats: [], showtimeDetails: null, totalAmount: 0 })
}));

export default useReservationStore;
