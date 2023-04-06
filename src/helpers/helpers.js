export const generateReference = () => {
  let text = ''
  let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  for (let i = 0; i < 10; i++) text += possible.charAt(Math.floor(Math.random() * possible.length))
  return text
}

/* eslint-disable no-useless-concat */


export const reactSelectStyle = {
  control: (base, state) => ({
    ...base,
    border: state.isFocused ? "0.1rem solid #6F6F6F" : "0.1rem solid #6F6F6F",
    // backgroundColor: state.isSelected ? "#6F6F6F" : "white",
    boxShadow: state.isFocused ? "0.1rem solid #6F6F6F" : 0,
    "&:hover": {
      // border: state.isFocused ? 0 : 0
    },
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? "#020202" : "white",
    color: state.isSelected ? "white" : "#020202",
  }),
};    

export const formatNumWithoutCommaNaira = (numb) => {
  // const nairaSymbol = "\u{020A6}";

  var regex = /[,\sNG]/g;
  var result = String(numb).replace(regex, "");
  return result;
};

export const formatNumWithCommaNaira = (numb) => {
  const nairaSymbol = "\u{020A6}";

  var regex = /[,\sNG]/g;
  var result = String(numb).replace(regex, "");
  var num = Math.abs(result);
  num = num.toFixed(2);
  const numSplit = num.split(".");
  var int = numSplit[0];
  const dec = numSplit[1];
  if (int.length > 3) {
    int = int.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  if (numb) {
    return  int + "." + dec;
  }

  return  "0" + "." + "00";
};