<?php
include_once '../../Model/Model_Inicio.php';

session_start();
if (isset($_SESSION['usuario'])) {
    if (isset($_GET['btnLogout'])) {
        session_unset();
        session_destroy();
        header('Location:../login.php');
    }
    if(isset($_GET['id'])){
            $usuario=$_SESSION['usuario'];
            $_SESSION['idSubasta']=$_GET['id'];

        $tpl_landig = file_get_contents('../../Vista/Camionero/postularse.html');
        $new_landig = str_replace("{{Nombre}}", $usuario->nombre, $tpl_landig);
        echo $new_landig;
    
    }else{
        echo "ERROR VOLVER ATRAS";
    }

}else{
    header('Location:../login.php');
}



?>