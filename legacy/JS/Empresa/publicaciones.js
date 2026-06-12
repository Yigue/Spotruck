
 document.addEventListener("DOMContentLoaded", () => {

     document.querySelector("#nav-menu").addEventListener("click", event => {

                    document.querySelector(".menu").classList.add("mostrar")
                    document.querySelector(".menu").classList.remove("ocultar")
                })

                document.querySelector("#menu-close").addEventListener("click", event => {

                    document.querySelector(".menu").classList.add("ocultar")
                    document.querySelector(".menu").classList.remove("mostrar")

    })
})
// -------------------------------------------------
    let opTipoDeCarga = document.getElementById('opTipoDeCarga');
  
function cargarTipoDeCarga(data){
    let template = '<option class="txt" selected disabled>-- Seleccione Tipo De Carga --</option>';
        data.forEach(dato => {
                        template += `<option class="txt" value="${dato.ID_TIPODECARGA}">${dato.tipoDeCarga}</option>`;
                    })
     opTipoDeCarga.innerHTML = template;
}

async function obtenerTipoDeCarga(){
    const response=await fetch(' ../../API/api_datos.php?modo=obtenerTipoDeCarga');
    const data = await response.json();
    return data;
    console.log(data);

}

// ------------------------------------------------
    // destino
    let opProvinciasDestino = document.getElementById('opProvinciasDestino');
    let opLocalidadesDestino = document.getElementById('opLocalidadesDestino');
    document.getElementById("localidadDestinoLB").style.display = "none";
    opLocalidadesDestino.style.display = "none";
    // origen
    let opProvinciasOrigen = document.getElementById('opProvinciasOrigen');
    let opLocalidadesOrigen = document.getElementById('opLocalidadesOrigen');
    document.getElementById("localidadesOrigenLB").style.display = "none";
    opLocalidadesOrigen.style.display = "none";


function cargarProvincias(data){
    let template = '<option class="txt" selected disabled>-- Seleccione Provincia --</option>';
        data.forEach(dato => {
                        template += `<option class="txt" value="${dato.ID_PROVINCIAS}">${dato.provincia}</option>`;
                    })
     opProvinciasDestino.innerHTML = template;
     opProvinciasOrigen.innerHTML=template;
 }
function cargarLocalidades(data){
    let template = '<option class="txt" selected disabled>-- Seleccione Localidad --</option>';

        data.forEach(dato => {
                        template += `<option class="txt" value="${dato.ID_LOCALIDAD}">${dato.localidad}</option>`;
                    })
     opLocalidadesDestino.innerHTML = template;
 }

 
function cargarLocalidadesOrigen(data){
    let template = '<option class="txt" selected disabled>-- Seleccione Localidad --</option>';

        data.forEach(dato => {
                        template += `<option class="txt" value="${dato.ID_LOCALIDAD}">${dato.localidad}</option>`;
                    })
     opLocalidadesOrigen.innerHTML = template;
 }


async function obtenerLocalidades(idProvincia){
    const response=await fetch(`../../API/api_datos.php?modo=obtenerLocalidadesProvincia&idProvincia="${idProvincia}"`);
    const data = await response.json();
    return data;
}

async function obtenerProvincias(){
    const response=await fetch(' ../../API/api_datos.php?modo=obtenerProvincias');
    const data = await response.json();
    return data;

}

// ----------------
obtenerProvincias().then(data=>{
    cargarProvincias(data);
})

opProvinciasDestino.addEventListener("change",() => {
            const idProvincia= opProvinciasDestino.value;
            obtenerLocalidades(idProvincia).then(datos=>{
            cargarLocalidades(datos);
            document.getElementById("localidadDestinoLB").style.display = "";
            opLocalidadesDestino.style.display = "";
        })
})

opProvinciasOrigen.addEventListener("change",() => {
            const idProvincia= opProvinciasOrigen.value;
            obtenerLocalidades(idProvincia).then(datos=>{
            cargarLocalidadesOrigen(datos);
        document.getElementById("localidadesOrigenLB").style.display = "";
        opLocalidadesOrigen.style.display = "";
        
        })
    
})

obtenerTipoDeCarga().then($data=>{
  cargarTipoDeCarga($data);
})

var formulario=document.getElementById('formularioPublicacion')
formulario.addEventListener('submit',function(e){
    e.preventDefault();
    // console.log("me dsite un click");
    var datosFormulario= new FormData(formulario);
    // console.log(datosFormulario);
    fetch('../../API/api_publicaciones.php?modo=hacerPublicaciones',{
        method:'POST',
        body:datosFormulario,
    })
    .then(res => res.json())
    .then(data => {
        console.log(data)
        // console.log(data.errno);
        const error=data.error;
        const errno=data.errno;
               
        document.getElementById("error").innerHTML=`<h4>${error}</h4>`
       
        if(errno==500){ 
        console.log(errno);
        formulario.reset();
    }
    })

})