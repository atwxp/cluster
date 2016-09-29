<?php  
    $file = $_POST['dataset'];
    $content = file_get_contents('../data/'.$file .'/' . $file .'-done.txt');
    echo $content;  
?>