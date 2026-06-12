

listarOferta().then(data => {
    // console.log(data);
   if(typeof data.errno  === 'undefined'){

       data.forEach(function(dat){  
                newOferta(dat);
            })

   }else{
          console.log(data.error);
     publiBody=` <h5>${data.error}</h5><p>`;
    document.getElementById("error").innerHTML+=publiBody;
        //   data.forEach(function(dat){  
        //         newOferta(dat);
        //     })
   }
          
})
function newOferta(dat){
    const tpl =tpl_Oferta.content;
    const clon= tpl.cloneNode(true);
   clon.querySelector(".Oferta_title").textContent+= `Postulacion ${dat.idOferta}`;


    publiBody=` <h5>Publicacion:${dat.idPublicacion}</h5><p>`;
    publiBody+=` <h5>Precio:${dat.precio}</h5><p>`;
    publiBody+=` <h5>Patente:${dat.patente}</h5><p>`;
    publiBody+=`<h5>Estado:${dat.estado}</h5><p>`;

    clon.querySelector(".OfertaDes").innerHTML+=publiBody ;


      
    container=` <h5>Publicacion:${dat.idPublicacion}</h5><p>`;
    container+=`<p><h5>Postulacion:</h5><p>`;
    container+=` <h5>Precio:${dat.precio}</h5><p>`;
    container+=`<h5>Estado:${dat.estado}</h5><p>`;
    container+=`<h5>Aclaracion:${dat.aclaracion}</h5><p>`;
    container+=`<h5>Fecha de Postulacion:${dat.fechaCreacion}</h5><p>`;
    container+=`<p> <h5>Camion ${dat.idCamion}</h5><p>`;
    container+=` <h5>Patente:${dat.patente}</h5><p>`;
 
   
    clon.querySelector("#vModal").setAttribute("id",`vModal${dat.idOferta}`);
 
    clon.querySelector(".modal-title").textContent+= `Oferta ${dat.idOferta}`;
    clon.querySelector(".modal-body").innerHTML+=container ;
    clon.querySelector("#btnModal").setAttribute("data-target",`#vModal${dat.idOferta}`);
    clon.querySelector("#btnBorrar").setAttribute("onclick",`borrarOferta("${dat.idOferta}")`);
   
    listadoOferta.appendChild(clon);
}

async function listarOferta(){
    const response=await fetch("../../API/api_subasta.php?modo=verMisPostulaciones");
    const data = await response.json();
    return data;
}
// async function borrarOferta($idOferta){
//     const response=await fetch(`../../API/api_subasta.php?modo=deleteOferta&idOferta=${idOferta}`);
//     const data = await response.json();
//     return data;
// }

// function borrarOferta(idPubli){
// borrarOferta(idPubli).then(data =>{
//     console.log(data.error);
//     location.reload();
//     // document.querySelector("#error").style.display = "";
//     // document.querySelector("#error").textContent+= data.error;
// })
// }

