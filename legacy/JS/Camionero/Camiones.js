

listarCamiones().then(data => {
    // console.log(data);
   if(typeof data.errno  === 'undefined'){

       data.forEach(function(dat){  
                newCamion(dat);
            })

   }else{
          console.log(data.error);
     publiBody=` <h5>${data.error}</h5><p>`;
    document.getElementById("error").innerHTML+=publiBody;
        //   data.forEach(function(dat){  
        //         newCamion(dat);
        //     })
   }
          
})
function newCamion(dat){
    const tpl =tpl_camion.content;
    const clon= tpl.cloneNode(true);

      container= `<h5>Tipo De Camion:${dat.tipoCamion}</h5><p>`;
      container+= `<h5>Capacidad:${dat.capacidad}</h5><p>`;
      container+= `<h5>Ruta:${dat.ruta}</h5><p>`;
      container+= `<h5>Patente:${dat.patente}</h5><p>`;
   
      

    publiBody=` <h5>Ruta:${dat.ruta}</h5><p>`;
    publiBody+=`<h5>Tipo De Camion:${dat.tipoCamion}</h5><p>`;
    publiBody+=` <h5>Patente:${dat.patente}</h5><p>`;

    clon.querySelector(".camionDes").innerHTML+=publiBody ;
    
    clon.querySelector("#vModal").setAttribute("id",`vModal${dat.idCamion}`);
    clon.querySelector(".camion_title").textContent+= `Camion ${dat.idCamion}`;
    clon.querySelector(".modal-title").textContent+= `Camion ${dat.idCamion}`;
    clon.querySelector(".modal-body").innerHTML+=container ;
    clon.querySelector("#btnModal").setAttribute("data-target",`#vModal${dat.idCamion}`);
    clon.querySelector("#btnBorrar").setAttribute("onclick",`borrarCamiones("${dat.idCamion}")`);
   
    listadoCamiones.appendChild(clon);
}

async function listarCamiones(){
    const response=await fetch("../../API/api_camion.php?modo=verMisCamiones");
    const data = await response.json();
    return data;
}
async function borrarCamion(idCamion){
    const response=await fetch(`../../API/api_camion.php?modo=deleteCamion&idCamion=${idCamion}`);
    const data = await response.json();
    return data;
}

function borrarCamiones(idPubli){
borrarCamion(idPubli).then(data =>{
    console.log(data.error);
    location.reload();
    // document.querySelector("#error").style.display = "";
    // document.querySelector("#error").textContent+= data.error;
})
}

