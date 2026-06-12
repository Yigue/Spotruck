
<?php

include_once '../../Model/Model_Inicio.php';

session_start();
$usuario = $_SESSION['usuario'];
$_SESSION['idEmpresa']=$usuario->idEmpresa;

if(isset($_SESSION['usuario'])){



    
// Boton Delogueo
if (isset($_GET['btnLogout'])) {
    session_unset();
    session_destroy();
    header('Location:../login.php');
}
// Boton Perfil
if (isset($_GET['btnPerfil'])) {
    header('Location:../perfil.php');
}
if (isset($_POST['btnPublicar'])) {
    header('Location:publicaciones.php');
}



    $tpl_landig = file_get_contents('../../Vista/Empresa/paginaEmpresa.html');
    $new_landig = str_replace("{{Nombre}}", $usuario->nombre, $tpl_landig);
    echo $new_landig;
}else{
    // Sino existe las session
    header('Location:../login.php');   
}

// include_once '../../Vista/Empresa/paginaEmpresa.html';








?>