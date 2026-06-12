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

                container= ` <h5>Origen:${Origen} >>>>> Destino:${Destino}</h5><p>`;
                container+= `<h5>Tipo de Carga:${dat.tipoDeCarga}</h5><p>`;
                container+= `<h5>Fecha De Inicio:${dat.fechaInicio}</h5><p>`;
                container+= `<h5>Fecha De Fin:${dat.fechaFin}</h5><p>`;
                container+= `<h5>Estado:${dat.estado}</h5><p>`;
                container+= `<h5>Volumen:${dat.volumen}</h5><p>`;
                container+= `<h5>Peso:${dat.peso}</h5><p>`;
                container+= `<h5>Detalle:${dat.detalle}</h5><p>`;
                container+= `<h5>Fecha De Creacion:${dat.fechaCreacion}</h5><p>`;
                clon.querySelector(".descrip_publi").innerHTML+=container ;

                container= ` <h5>Nombre ${dat.nombre}</h5><p>`;
                container+= `<h5>Cuit ${dat.cuit}</h5><p>`;
                container+= `<h5>Puntaje ${dat.puntaje}</h5><p>`;
                container+= `<h5>Viaje Realizados ${dat.viajesRealizados}</h5><p>`;
                clon.querySelector(".descrip_camionero").innerHTML+=container ;

                container= ` <h5>Patente ${dat.patente}</h5><p>`;
                container+= `<h5>Tipo De Camion ${dat.tipoDeCamion}</h5><p>`;
                container+= `<h5>Ruta ${dat.ruta}</h5><p>`;
                container+= `<h5>Precio ${dat.precio}</h5><p>`;
                container+= `<h5>Aclaracion ${dat.aclaracion}</h5><p>`;
                clon.querySelector(".descrip_camion").innerHTML+=container ;
                listadoPublicaciones.appendChild(clon);
            }
// 


            async function obtenerLocalidadesProvincia(id){
                const response=await fetch( `../../API/api_datos.php?modo=saberLocalidad&idLocalidad="${id}"`);
                const data = await response.json();
                // console.log(data);
                return data;
            }
            async function listarPublicaciones(){
                const response=await fetch("../../API/api_viaje.php?modo=obtenerViaje");
                const data = await response.json();
                return data;
            }


        })


