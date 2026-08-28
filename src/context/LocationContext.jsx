import { useLocationStore } from '../store/useLocationStore';

export function LocationProvider({ children }) {
  return <>{children}</>;
}

export const useLocation = () => {
  const location = useLocationStore(state => state.location);
  const locationModal = useLocationStore(state => state.locationModal);
  const selectedStore = useLocationStore(state => state.selectedStore);
  const pincodeMap = useLocationStore(state => state.pincodeMap);
  const setLocationModal = useLocationStore(state => state.setLocationModal);
  const setSelectedStore = useLocationStore(state => state.setSelectedStore);
  const setLocationByPincode = useLocationStore(state => state.setLocationByPincode);
  const detectLocation = useLocationStore(state => state.detectLocation);
  const clearLocation = useLocationStore(state => state.clearLocation);

  return {
    location,
    locationModal,
    selectedStore,
    pincodeMap,
    setLocationModal,
    setSelectedStore,
    setLocationByPincode,
    detectLocation,
    clearLocation,
  };
};
