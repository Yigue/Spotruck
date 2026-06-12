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

    

                publiBody=` Origen:${Origen}<p>`;
                publiBody+=` Destino:${Destino}<p>`;
                publiBody+=` Fecha De Inicio:${dat.fechaInicio}<p>`;

                clon.querySelector(".card-content").innerHTML+=publiBody ;
                if(dat.estado=="En Subasta"){  
                    clon.querySelector("#pPublicacion").setAttribute("onclick",`publi("${dat.ID_PUBLICACION}")`);
                }else{
                    clon.querySelector("#pPublicacion").setAttribute("onclick",`verViaje("${dat.ID_PUBLICACION}")`);
                }

            
                listadoPublicaciones.appendChild(clon);
            }
            async function obtenerLocalidadesProvincia(id){
                const response=await fetch( `../../API/api_datos.php?modo=saberLocalidad&idLocalidad="${id}"`);
                const data = await response.json();
                // console.log(data);
                return data;
            }
            async function listarPublicaciones(){
                const response=await fetch("../../API/api_publicaciones.php?modo=obtenerMisPublicaciones");
                const data = await response.json();
                return data;
            }
                 })
            async function borrarPublicacion(idPublicacion){
                const response=await fetch(`../../API/api_publicaciones.php?modo=deletePublicacion&idPublicacion=${idPublicacion}`);
                const data = await response.json();
                return data;
            }



            function borrarPubli(idPubli){
            borrarPublicacion(idPubli).then(data =>{
                console.log(data.error);
                location.reload();
            })}

            function publi(idPubli){
                window.location.href =`verPublicacion.php?idPubli=${idPubli}`;   
            }
            function verViaje(idPubli){
                window.location.href =`verViaje.php?idPubli=${idPubli}`;   
            }

