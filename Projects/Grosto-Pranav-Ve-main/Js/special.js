var donbill = 0 ;
var brebill = 0 ;
var ketbill = 0 ;
var doncon = 0;
var brecon = 0;
var ketcon = 0;


{
  let numContainer = document.getElementById("dnum");
  let value = 0;
  let donprice=30;
  let sumd=0;
  let btnInc = document.querySelector(".dinc");
  let btnDec = document.querySelector(".ddec");

  btnInc.addEventListener("click", () => {
    value++;
    
    if (value > 5) {
      value = 5;
     
    }
    sumd=donprice*value;
    
    numContainer.textContent = value;
    if (sumd >151 ) {
      
      sumd=150;
    }
    
    
    donbill = sumd; 
    doncon = value; 
  });


  btnDec.addEventListener("click", () => {
    value--;

    if (value < 0) {
      value = 0;
    }
    sumd=donprice*value;
    numContainer.textContent = value;
    if (sumd <0 ) {
      
      sumd=0;
    }
    
    donbill = sumd;  
    doncon = value; 
  });
}

/////////////////////////////////////////////////////////////
{
  let numContainer = document.getElementById("bnum");
  let value = 0;
  let breprice=40;
  let sumb=0;
  let btnInc = document.querySelector(".binc");
  let btnDec = document.querySelector(".bdec");


  btnInc.addEventListener("click", () => {
    value++;
    
    if (value > 5) {
      value = 5;
     
    }
    sumb=breprice*value;
    
    numContainer.textContent = value;
    if (sumb >201 ) {
      
      sumb=150;
    }
    
    brebill = sumb;  
    brecon=value;
  });


  btnDec.addEventListener("click", () => {
    value--;

    if (value < 0) {
      value = 0;
    }
    sumb=breprice*value;
    numContainer.textContent = value;
    if (sumb <0 ) {
      
      sumb=0;
    }
    
    brebill = sumb;  
    brecon=value;
  });
}
////////////////////////////////////////////////////
{
  let numContainer = document.getElementById("knum");
  let value = 0;
  let ketprice=65;
  let sumk=0;
  let btnInc = document.querySelector(".kinc");
  let btnDec = document.querySelector(".kdec");
  

  btnInc.addEventListener("click", () => {
    value++;
    if (value > 5) {
      value = 5;
     
    }
    sumk=ketprice*value;
    
    numContainer.textContent = value;
    if (sumk >326 ) {
      
      sumk=150;
    }
    
    ketbill = sumk;  
    ketcon = value;
  });


  btnDec.addEventListener("click", () => {
    value--;

    if (value < 0) {
      value = 0;
    }
    sumk=ketprice*value;
    numContainer.textContent = value;
    if (sumk <0 ) {
      
      sumk=0;
    }
    
    ketbill = sumk;  
    ketcon = value;
  });
}
//////////////////////////////////////////////
function cart() {

  alert("Cart :\n\n Donuts ("+doncon+") : "+donbill+" Rs \n Bread ("+brecon+") : "+brebill+" Rs \n Ketchup ("+ketcon+") : "+ketbill+" Rs \n\n Total Bill : "+(donbill+brebill+ketbill)+" Rs" );

}
