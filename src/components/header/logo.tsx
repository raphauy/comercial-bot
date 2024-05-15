"use client";

import Image from "next/image";
import Link from "next/link";


export default function Logo() {

  return (
    <Link href="/">
      <div className="text-3xl font-bold">
        <span className="text-rosa-osom">Comercial</span>
        <span className="text-verde-openai">Bot</span>
      </div>
    </Link>

  )
}
