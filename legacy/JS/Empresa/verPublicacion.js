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
                container= ` <h4>Origen:${Origen} >>>>> Destino:${Destino}</h4><p>`;
                container+= `<h4>Tipo de Carga:${dat.tipoDeCarga}</h4><p>`;
                container+= `<h4>Fecha De Inicio:${dat.fechaInicio}</h4><p>`;
                container+= `<h4>Fecha De Fin:${dat.fechaFin}</h4><p>`;
                container+= `<h4>Estado:${dat.estado}</h4><p>`;
                container+= `<h4>Volumen:${dat.volumen}</h4><p>`;
                container+= `<h4>Peso:${dat.peso}</h4><p>`;
                container+= `<h4>Detalle:${dat.detalle}</h4><p>`;
                container+= `<h4>Fecha De Creacion:${dat.fechaCreacion}</h4><p>`;
                clon.querySelector(".descrip").innerHTML+=container ;
                listadoPublicaciones.appendChild(clon);
            }
// 
  listarOfertas().then(data => {
                                    data.forEach(function(dat){  
                                         newPostu(dat);
                                        //  newModal(dat);
                                    })
                                })

            function newPostu(dat){
                const tpl1 =tpl_oferta.content;
                const clon1= tpl1.cloneNode(true);
                clon1.querySelector(".postu").innerHTML=dat.nombre;
                clon1.querySelector(".precio").innerHTML= dat.precio;
                clon1.querySelector(".fecha").innerHTML=dat.fechaCreacion;
                clon1.querySelector("#btnOferta").setAttribute("data-target",`Modal${dat.idOferta}`);
                tabledata.appendChild(clon1);

                const tpl2 =tpl_modal.content;
                const clon2= tpl2.cloneNode(true);
                clon2.querySelector("#user").innerHTML=`<h4>${dat.nombre}</h4>`;
                container= `<h5>Viajes Realizados:${dat.viajesRealizados}</h5><p>`;
                container+= `<h5>Camion:${dat.patente}</h5><p>`;
                container+= `<h5>Tipo De Camion:${dat.tipoDeCamion}</h5><p>`;
                container+= `<h5>Capacidad:${dat.capacidad}</h5><p>`;
                container+= `<h5>Precio Propuesto:${dat.precio}</h5><p>`;
                container+= `<h5>Se postulo el dia:${dat.fechaCreacion}</h5><p>`;
                container+= `<h5>Aclaracion:${dat.aclaracion}</h5><p>`;

                clon2.querySelector(".modal-body").innerHTML+=container ;

                clon2.querySelector(".modal").setAttribute("id",`Modal${dat.idOferta}`);
                clon2.querySelector("#btnRechazar").setAttribute("onclick",`rechazarOferta("${dat.idOferta}")`);
                clon2.querySelector("#btnAceptar").setAttribute("onclick",`aceptarOferta(${dat.idOferta},${dat.idSubasta})`);
                modales.appendChild(clon2);

                        var elems = document.querySelectorAll('.modal');
                        var instances = M.Modal.init(elems);
            }

            async function obtenerLocalidadesProvincia(id){
                const response=await fetch( `../../API/api_datos.php?modo=saberLocalidad&idLocalidad="${id}"`);
                const data = await response.json();
                // console.log(data);
                return data;
            }
            async function listarPublicaciones(){
                const response=await fetch("../../API/api_publicaciones.php?modo=obtenerData");
                const data = await response.json();
                return data;
            }
                async function listarOfertas(){
                const response=await fetch("../../API/api_subasta.php?modo=verOfertas");
                const data = await response.json();
                return data;
            }



        })
    

      
           
               function rechazarOferta(idOferta){

                                    Swal.fire({
                    title: 'Estas Seguro?',
                    text: "No podras volver atras",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'Si Rechazar!'
                    }).then((result) => {
                    if (result.isConfirmed) {
                        fetch(`../../API/api_subasta.php?modo=rechazarOferta&ifOferta=${idOferta}`)
                        .then(data=>{
                            console.log(data)
                            if(data.errno==200){ 
                                Swal.fire(
                                'Se Ha Rechazado!',
                                'Has rechazado la oferta',
                                'success'
                                )
                                location.reload();
                            }else{
                                Swal.fire(
                                'Algo a Salido Mal',
                                '404',
                                'warning'
                                ) 
                            }
                        })
                    }
                     })  
            }
            function aceptarOferta(idOferta,idSubasta,idPubli){
                                    Swal.fire({
                    title: 'Estas Seguro?',
                    text: "Se cerrara la subasta",
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonColor: '#3085d6',
                    cancelButtonColor: '#d33',
                    confirmButtonText: 'Si Aceptar!'
                    }).then((result) => {
                    if (result.isConfirmed) {
                        
                         fetch(`../../API/api_subasta.php?modo=aceptarOferta&idSubasta=${idSubasta}&ifOferta=${idOferta}`).then(data=>{
                            if(data.errno=200){ 
                                  Swal.fire(
                                    'Se Ha Aceptado!',
                                    'Has rechazado la oferta',
                                    'success'
                                    )
                                window.location.href =`verViaje.php?idPubli=${idPubli}`;
                            }else{
                                Swal.fire(
                                'Algo a Salido Mal',
                                '404',
                                'warning'
                                ) 
                            }
                     
                        })
                    }
                     })  
            }

