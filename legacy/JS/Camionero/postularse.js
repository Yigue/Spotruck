
 document.addEventListener("DOMContentLoaded", () => {

   let opCamion = document.getElementById('idCamion');
  
function cargarCamiones(data){
    let template = '<option class="txt" selected disabled>-- Seleccione Su Camion --</option>';
        data.forEach(dato => {
                        template += `<option class="txt" value="${dato.idCamion}">${dato.patente}</option>`;
                    })
     opCamion.innerHTML = template;
}

async function obtenerCamiones(){
    const response=await fetch("../../API/api_camion.php?modo=verMisCamiones");
    const data = await response.json();
    return data;
}

obtenerCamiones().then($data=>{
  cargarCamiones($data);
})




    var formulario=document.getElementById('formulariiOferta')
    formulario.addEventListener('submit',function(e){
            e.preventDefault();
            console.log("me dsite un click");
            var datosFormulario= new FormData(formulario);
            console.log(datosFormulario);
            fetch('../../API/api_subasta.php?modo=hacerOferta',{
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

})