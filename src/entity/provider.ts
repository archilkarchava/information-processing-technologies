import {
  Check,
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import Supply from './supply';

@Entity({ name: 'S' })
@Unique(['name', 'address', 'city'])
@Check(`"Risk" in (1, 2, 3)`)
export default class Provider {
  @PrimaryGeneratedColumn({ name: 'SID', type: 'int' })
  id: number;

  @Column({ name: 'SName', type: 'char', length: 20, nullable: false })
  name: string;

  @Column({ name: 'SCity', type: 'char', length: 20, nullable: false })
  city: string;

  @Column({ name: 'Address', type: 'char', length: 50 })
  address: boolean;

  @Column({ name: 'Risk', type: 'int' })
  risk: number;

  @OneToMany(
    _type => Supply,
    supply => supply.provider,
  )
  supplies: Supply[];
}
