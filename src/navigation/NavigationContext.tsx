import React, { createContext, useContext, useState } from "react";

type NavigationContextType = {
  previousScreen: string;
  setPreviousScreen: (screen: string) => void;
};

const NavigationContext = createContext<NavigationContextType>({
  previousScreen: "Home",
  setPreviousScreen: () => {},
});

export const useNavigationContext = () => useContext(NavigationContext);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [previousScreen, setPreviousScreen] = useState("Home");

  return (
    <NavigationContext.Provider value={{ previousScreen, setPreviousScreen }}>
      {children}
    </NavigationContext.Provider>
  );
};
