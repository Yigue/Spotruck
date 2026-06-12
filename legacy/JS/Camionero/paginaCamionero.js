
  document.addEventListener("DOMContentLoaded", () => {



      
                listarPublicaciones().then(data => {
                    // console.log(data);
                    data.forEach(function(dat){  
                        obtenerLocalidadesProvincia(dat.localidadOrigen).then(or => {
                            // console.log(dato)
                            const Origen=or;
                            obtenerLocalidadesProvincia(dat.localidadDestino).then(des => {
                                const Destino=des;
                                newPublicacion(dat,Origen,Destino);
                            })
                            
                            
                        })
                

                    })
                })
                function newPublicacion(dat,Origen,Destino){
                    const tpl = tpl_publicacion.content;
                    const clon= tpl.cloneNode(true);

                    container= ` <h5>Origen:${Origen}</h5><p>`;
                    container+= `<h5>Destino:${Destino}</h5><p>`;
                    container+= `<h5>Tipo de Carga:${dat.tipoDeCarga}</h5><p>`;
                    container+= `<h5>Fecha De Inicio:${dat.fechaInicio}</h5><p>`;
                    container+= `<h5>Fecha De Fin:${dat.fechaFin}</h5><p>`;
                    container+= `<h5>Estado:${dat.estado}</h5><p>`;
                    container+= `<h5>Volumen:${dat.volumen}</h5><p>`;
                    container+= `<h5>Peso:${dat.peso}</h5><p>`;
                    container+= `<h5>Detalle:${dat.detalle}</h5><p>`;
                    container+= `<h5>Fecha De Creacion:${dat.fechaCreacion}</h5><p>`;

                    publiBody=` <h5>Origen:${Origen}</h5><p>`;
                    publiBody+=` <h5>Destino:${Destino}</h5><p>`;
                    publiBody+=` <h5>Fecha De Inicio:${dat.fechaInicio}</h5><p>`;

                    clon.querySelector(".publicacion_descrip").innerHTML+=publiBody ;
                    
                    clon.querySelector("#vModal").setAttribute("id",`vModal${dat.ID_PUBLICACION}`);
                    clon.querySelector(".publicacion_title").textContent+= `Publicacion ${dat.ID_PUBLICACION}`;
                    clon.querySelector(".modal-title").textContent+= `Publicacion ${dat.ID_PUBLICACION}`;
                    clon.querySelector(".modal-body").innerHTML+=container ;
                    clon.querySelector("#btnModal").setAttribute("data-target",`#vModal${dat.ID_PUBLICACION}`);
                    clon.querySelector("#btnPostularse").setAttribute("onclick",`postularse("${dat.idSubasta}")`);
                    listadoPublicaciones.appendChild(clon);
                    }
          
                async function obtenerLocalidadesProvincia(id){
                    const response=await fetch( `../../API/api_datos.php?modo=saberLocalidad&idLocalidad="${id}"`);
                    const data = await response.json();
                    // console.log(data);
                    return data;
                }

                async function listarPublicaciones(){
                    const response=await fetch("../../API/api_publicaciones.php?modo=obtenerPublicaciones");
                    const data = await response.json();
                    // console.log(data);
                    return data;
                }


   })
     function postularse(idSubasta){
       
                        window.location.href =`postularse.php?id=${idSubasta}`;
                        console.log(a);
                        }
           function initMap() {

    if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(mostrarUbicacion);
         } 

    function mostrarUbicacion(position) {
        let latitud = position.coords.latitude; //Obtener latitud
        let longitud = position.coords.longitude; //Obtener longitud
        let altura = position.coords.altitude;
        const uluru = { lat: latitud, lng: longitud };
             
            const map = new google.maps.Map(document.getElementById("map"), {
                zoom: 12,
                center: uluru,
            });
            const iconBase =
    "https://developers.google.com/maps/documentation/javascript/examples/full/images/";
  const icons = {
    parking: {
      icon: iconBase + "parking_lot_maps.png",
    },
    library: {
      icon: iconBase + "library_maps.png",
    },
    info: {
      icon: iconBase + "info-i_maps.png",
    },
  };
            const features = [
    {
      position: new google.maps.LatLng(-34.476818, -58.777232),

      type: "parking",
    },
    {
      position: new google.maps.LatLng(-34.466833, -58.756030),
      type: "parking",
    },
    {
      position: new google.maps.LatLng(-34.471006, -58.758608),
      type: "parking",
    },];
  for (let i = 0; i < features.length; i++) {
                const marker = new google.maps.Marker({
                position: features[i].position,
                icon: icons[features[i].type].icon,
                map: map,
                });
            }

            const marker = new google.maps.Marker({
                position: uluru,
                map: map,
            });
            }
           
            window.initMap = initMap;  
         }		

 
