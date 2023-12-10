// dairy
var butterbill = 0;
var buttercon = 0;

var milkbill = 0;
var milkcon = 0;

var mozzabill = 0;
var mozzacon = 0;



//fruits
var avocabill = 0;
var avocacon = 0;

var grapebill = 0;
var grapecon = 0;

var mangobill = 0;
var mangocon = 0;

//veggies
var cucbill = 0;
var cuccon = 0;

var letubill = 0;
var letucon = 0;

var potbill = 0;
var potcon = 0;



//Dairy
//////////////////////////////////////////////////////////////////////////////////////////////////////
{
  {
    let numContainer = document.getElementById("butternum");
    let value = 0;

    let price = 70;
    let sum = 0;

    let btnInc = document.querySelector(".butterinc");
    let btnDec = document.querySelector(".butterdec");

    btnInc.addEventListener("click", () => {
      value++;
      
      if (value > 5) {
        value = 5;
       
      }
      sum=price*value;
      
      numContainer.textContent = value;
      if (sum >351 ) {
        
        sum=350;
      }
      
      
      butterbill = sum; 
      buttercon = value; 
    });
  
  
    btnDec.addEventListener("click", () => {
      value--;
  
      if (value < 0) {
        value = 0;
      }
      sum=price*value;
      numContainer.textContent = value;
      if (sum <0 ) {
        
        sum=0;
      }
      
      butterbill = sum; 
      buttercon = value; ; 
    });
  }
  ////////////////////////////////////////////////////////////////////////////////////////

  {
    let numContainer = document.getElementById("milknum");
    let value = 0;

    let price = 150;
    let sum = 0;

    let btnInc = document.querySelector(".milkinc");
    let btnDec = document.querySelector(".milkdec");

    btnInc.addEventListener("click", () => {
      value++;
      
      if (value > 5) {
        value = 5;
       
      }
      sum=price*value;
      
      numContainer.textContent = value;
      if (sum >751 ) {
        
        sum=750;
      }
      
      
      milkbill = sum; 
      milkcon = value; 
    });
  
  
    btnDec.addEventListener("click", () => {
      value--;
  
      if (value < 0) {
        value = 0;
      }
      sum=price*value;
      numContainer.textContent = value;
      if (sum <0 ) {
        
        sum=0;
      }
      
      milkbill = sum; 
      milkcon = value; ; 
    });
  }
  ////////////////////////////////////////////////////////////////////////////////////////
  {
    let numContainer = document.getElementById("mozzanum");
    let value = 0;

    let price = 2000 ;
    let sum = 0;

    let btnInc = document.querySelector(".mozzainc");
    let btnDec = document.querySelector(".mozzadec");


    btnInc.addEventListener("click", () => {
      value++;
      
      if (value > 5) {
        value = 5;
       
      }
      sum=price*value;
      
      numContainer.textContent = value;
      if (sum >10001 ) {
        
        sum=10000;
      }
      
      
      mozzabill = sum; 
      mozzacon = value; 
    });
  
  
    btnDec.addEventListener("click", () => {
      value--;
  
      if (value < 0) {
        value = 0;
      }
      sum=price*value;
      numContainer.textContent = value;
      if (sum <0 ) {
        
        sum=0;
      }
      
      mozzabill = sum; 
      mozzacon = value;  
    });
  }

  ////////////////////////////////////////////////////////////////////////////////////////

}



//fruits
{
  {
    let numContainer = document.getElementById("avocnum");
    let value = 0;

    let price = 70;
    let sum = 0;

    let btnInc = document.querySelector(".avocinc");
    let btnDec = document.querySelector(".avocdec");

    btnInc.addEventListener("click", () => {
      value++;
      
      if (value > 5) {
        value = 5;
       
      }
      sum=price*value;
      
      numContainer.textContent = value;
      if (sum >351 ) {
        
        sum=350;
      }
      
      
      avocabill = sum; 
      avocacon = value; 
    });
  
  
    btnDec.addEventListener("click", () => {
      value--;
  
      if (value < 0) {
        value = 0;
      }
      sum=price*value;
      numContainer.textContent = value;
      if (sum <0 ) {
        
        sum=0;
      }
      
      avocabill = sum; 
      avocacon = value; 
    });
  }
  ////////////////////////////////////////////////////////////////////////////////////////

  {
    let numContainer = document.getElementById("grapefrunum");
    let value = 0;

    let price = 50;
    let sum = 0;

    let btnInc = document.querySelector(".grapefruinc");
    let btnDec = document.querySelector(".grapefrudec");


    btnInc.addEventListener("click", () => {
      value++;
      
      if (value > 5) {
        value = 5;
       
      }
      sum=price*value;
      
      numContainer.textContent = value;
      if (sum >251 ) {
        
        sum=250;
      }
      
      
      grapebill = sum; 
      grapecon = value; 
    });
  
  
    btnDec.addEventListener("click", () => {
      value--;
  
      if (value < 0) {
        value = 0;
      }
      sum=price*value;
      numContainer.textContent = value;
      if (sum <0 ) {
        
        sum=0;
      }
      
      grapebill = sum; 
      grapecon = value;  
    });
  }
  ////////////////////////////////////////////////////////////////////////////////////////
  {
    let numContainer = document.getElementById("mangonum");
    let value = 0;

    let price =200 ;
    let sum = 0;

    let btnInc = document.querySelector(".mangoinc");
    let btnDec = document.querySelector(".mangodec");


    btnInc.addEventListener("click", () => {
      value++;
      
      if (value > 5) {
        value = 5;
       
      }
      sum=price*value;
      
      numContainer.textContent = value;
      if (sum >1001 ) {
        
        sum=1000;
      }
      
      
      mangobill = sum; 
      mangocon = value; 
    });
  
  
    btnDec.addEventListener("click", () => {
      value--;
  
      if (value < 0) {
        value = 0;
      }
      sum=price*value;
      numContainer.textContent = value;
      if (sum <0 ) {
        
        sum=0;
      }
      
      mangobill = sum; 
      mangocon = value;
    });
  }



}

////////////////////////////////////////////////////////////////////////////////////////

//vegetables

{
  {
    let numContainer = document.getElementById("cucnum");
    let value = 0;

    let price = 200;
    let sum = 0;

    let btnInc = document.querySelector(".cucinc");
    let btnDec = document.querySelector(".cucdec");

    btnInc.addEventListener("click", () => {
      value++;
      
      if (value > 5) {
        value = 5;
       
      }
      sum=price*value;
      
      numContainer.textContent = value;
      if (sum >1001 ) {
        
        sum=1000;
      }
      
      
      cucbill = sum; 
      cuccon = value; 
    });
  
  
    btnDec.addEventListener("click", () => {
      value--;
  
      if (value < 0) {
        value = 0;
      }
      sum=price*value;
      numContainer.textContent = value;
      if (sum <0 ) {
        
        sum=0;
      }
      
      cucbill = sum; 
      cuccon = value; 
    });
  }
  ////////////////////////////////////////////////////////////////////////////////////////

  {
    let numContainer = document.getElementById("letunum");
    let value = 0;

    let price = 150;
    let sum = 0;

    let btnInc = document.querySelector(".letuinc");
    let btnDec = document.querySelector(".letudec");


    btnInc.addEventListener("click", () => {
      value++;
      
      if (value > 5) {
        value = 5;
       
      }
      sum=price*value;
      
      numContainer.textContent = value;
      if (sum >751 ) {
        
        sum=750;
      }
      
      
      letubill = sum; 
      letucon = value;
    });
  
  
    btnDec.addEventListener("click", () => {
      value--;
  
      if (value < 0) {
        value = 0;
      }
      sum=price*value;
      numContainer.textContent = value;
      if (sum <0 ) {
        
        sum=0;
      }
      
      letubill = sum; 
      letucon = value;
    });
  }
  ////////////////////////////////////////////////////////////////////////////////////////
  {
    let numContainer = document.getElementById("potnum");
    let value = 0;

    let price = 20;
    let sum = 0;

    let btnInc = document.querySelector(".potinc");
    let btnDec = document.querySelector(".potdec");


    btnInc.addEventListener("click", () => {
      value++;
      
      if (value > 5) {
        value = 5;
       
      }
      sum=price*value;
      
      numContainer.textContent = value;
      if (sum >101 ) {
        
        sum=100;
      }
      
      
      potbill = sum; 
      potcon = value;
    });
  
  
    btnDec.addEventListener("click", () => {
      value--;
  
      if (value < 0) {
        value = 0;
      }
      sum=price*value;
      numContainer.textContent = value;
      if (sum <0 ) {
        
        sum=0;
      }
      
      potbill = sum; 
      potcon = value;
    });
  }

  ////////////////////////////////////////////////////////////////////////////////////////

}


//////////////////////////////////////////////////////////////////////////////////////////////

function cart() {

alert("Cart :\n\n Total BIll : "+(butterbill+milkbill+mozzabill+avocabill+grapebill+mangobill+cucbill+letubill+potbill)+" Rs \n\n Dairy: \n Butter (" +(200*buttercon) + "g) : " + butterbill + " Rs \n Milk (" +milkcon + "L) : " + milkbill + " Rs \n Mozzarella (" +(500*0.001*mozzacon) + "Kg) : " + mozzabill + " Rs \n\n Fruits \n avocado (" +avocacon + "Pc) : " + avocabill + " Rs \n Grapefruit (" +grapecon + "Pc) : " + grapebill + " Rs \n Mango (" +mangocon + "Pc) : " + mangobill + " Rs \n\n Vegetables \n Cucumber (" +cuccon + "Kg) : " + cucbill + " Rs \n Lettuce (" +letucon + "Pc) : " + letubill + " Rs \n Potato (" +potcon + "Kg) : " + potbill + " Rs  " );

 
}
// dairy
var butterbill = 0;
var buttercon = 0;

var milkbill = 0;
var milkcon = 0;

var mozzabill = 0;
var mozzacon = 0;



//fruits
var avocabill = 0;
var avocacon = 0;

var grapebill = 0;
var grapecon = 0;

var mangobill = 0;
var mangocon = 0;

//veggies
var cucbill = 0;
var cuccon = 0;

var letubill = 0;
var buttercon = 0;

var potbill = 0;
var potcon = 0;
