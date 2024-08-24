import React from "react";
import { images } from "../../constants";
import "./Header.css";

const Header = () => {
  return (
    <div className="header-container">
      <img className="logo" src={images.billio} alt="Billio logo" />
    </div>
  );
};

export default Header;
