
<?php
include_once '../Model/Model_Inicio.php';
session_start();


// Cosas de control register
if(isset($_SESSION['idusuario'])){ 
    // guardamos enuna variable el id de usuario que se acaba de registrar ( para hacer la relacion)
    $idusu = $_SESSION['idusuario'];
    $Email = $_SESSION['Email'];
    $Contrasena = $_SESSION['Contrasena'];
    // lo tieve que ahcer asi pq no me funcionaba,Verificar luego si se puede hcer mejor
    $usuario = new User($Email, $Contrasena);


// si toco el boton
    if(isset($_POST['btnTrasportista'])){
        
        $Licencia=$_POST['txtLicencia'];
        $Zona = $_POST['txtzona'];

        // verifica si el iddeusuario ya tiene un id trasportista
        $usuario->VerificarTrasportista($usuario,$idusu);
   

        if($usuario->errno==600){
            // No deberia entrar nunca aca teoricamente
            $msg="Ya tiene un ID_Trasportista";
        }else{
            // sino esta registrado el trasportista lo registra y redireciona a la pagina
            $usuario->registrarTrasportista($idusu, $Licencia, $Zona);
            header('Location:Camionero/camionero.php');
        }
     


    }






// Sino llego ninguna variable hay un prolema y se redireciona a la anterior pagina
}else{

    header('Location:register.php');

}
$msg = "";




// Trae la vista
//include_once '../Vista/header.html';
//include_once '../Vista/Camionero/registerCamion.html';
//include_once '../Vista/pie_vista.php';

$tpl_landig = file_get_contents('../Vista/Camionero/registerCamion.html');
$new_landig = str_replace("{{MENSAJE}}", $msg, $tpl_landig);
echo $new_landig;
?>