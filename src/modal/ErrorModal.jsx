/* eslint-disable jsx-a11y/no-noninteractive-element-interactions */
import React from "react";
// import { ButtonPrimary } from "../../../../components/buttons/ButtonReuse";
import "./ErrorModal.css";
import { RavenButton } from 'raven-bank-ui';

const ErrorModal = ({
  onCancel,
  onClick,
  smallText,
  bigText,
  btnText,
  color,
  fillColor,
  loading,
}) => {
  return (
    <div className="error-modal-wrap">
      {/* title start */}
      <p className="title">{bigText}</p>
      {/* title end */}
      {/* text start */}
      <p className="text">{smallText}</p>
      {/* text end */}
      {/* btn wrap start */}
      <div className="btn-wrap">
        <RavenButton
          onClick={onClick}
          className="cancel btn-outline-error-light
          "
          loading={loading}
          color={color}
          style={{width: '50%'}}
          label={`Yes, Cancel`}
        />
        <RavenButton
          onClick={onCancel}
          loading={loading}
          style={{width: '50%', fontWeight: '500'}}
          color={color}
          label={`${btnText}`}
        />
      </div>
      {/* btn wrap end */}
    </div>
  );
};

export default ErrorModal;
