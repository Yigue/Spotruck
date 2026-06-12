
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
    let opTipoDeCamion = document.getElementById('opTipoDeCamion');
  
function cargarTipoDeCarga(data){
    let template = '<option class="txt" selected disabled>-- Seleccione Tipo De Carga --</option>';
        data.forEach(dato => {
                        template += `<option class="txt" value="${dato.ID_TIPODECAMION}">${dato.tipoDeCamion}</option>`;
                    })
     opTipoDeCamion.innerHTML = template;
}

async function obtenerTipoDeCamion(){
    const response=await fetch(' ../API/api_datos.php?modo=obtenerTipoDeCamion');
    const data = await response.json();
        console.log(data);
    return data;


}


obtenerTipoDeCamion().then($data=>{
  cargarTipoDeCarga($data);
})

var formulario=document.getElementById('formularioPublicacion')
formulario.addEventListener('submit',function(e){
    e.preventDefault();
    // console.log("me dsite un click");
    var datosFormulario= new FormData(formulario);
    // console.log(datosFormulario);
    fetch('../API/api_camion.php?modo=cargarCamion',{
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
       
        if(errno==200){ 
        console.log(errno);
        formulario.reset();
    }
    })

})